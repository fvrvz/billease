package com.billease.domain

import java.math.RoundingMode
import scala.math.BigDecimal.RoundingMode as RM

case class TaxBreakdown(
    taxableAmount: BigDecimal,
    cgstAmount: BigDecimal,
    sgstAmount: BigDecimal,
    igstAmount: BigDecimal,
    totalAmount: BigDecimal
)

object GstCalculator:

  def round2(value: BigDecimal): BigDecimal =
    value.setScale(2, RM.HALF_UP)

  /**
   * Calculates GST breakdown for a line item.
   *
   * @param priceUnit Unit selling price
   * @param quantity Quantity purchased
   * @param discountAmount Any discount applied on this item
   * @param gstRate GST percentage (e.g., 0, 5, 12, 18, 28)
   * @param isPriceTaxInclusive True if retail price is MRP/all-inclusive
   * @param hasStoreGst True if store is GST-registered
   * @param isInterState True if customer GSTIN belongs to different state than store
   */
  def calculateItemTax(
      priceUnit: BigDecimal,
      quantity: BigDecimal,
      discountAmount: BigDecimal,
      gstRate: BigDecimal,
      isPriceTaxInclusive: Boolean,
      hasStoreGst: Boolean,
      isInterState: Boolean
  ): TaxBreakdown =
    val grossTotal = round2((priceUnit * quantity) - discountAmount)

    if !hasStoreGst || gstRate <= BigDecimal(0) then
      TaxBreakdown(
        taxableAmount = grossTotal,
        cgstAmount = BigDecimal(0),
        sgstAmount = BigDecimal(0),
        igstAmount = BigDecimal(0),
        totalAmount = grossTotal
      )
    else if isPriceTaxInclusive then
      // Backward calculation: Taxable = Gross / (1 + rate / 100)
      val divisor = BigDecimal(1) + (gstRate / BigDecimal(100))
      val taxable = round2(grossTotal / divisor)
      val totalTax = round2(grossTotal - taxable)

      if isInterState then
        TaxBreakdown(
          taxableAmount = taxable,
          cgstAmount = BigDecimal(0),
          sgstAmount = BigDecimal(0),
          igstAmount = totalTax,
          totalAmount = grossTotal
        )
      else
        val halfTax = round2(totalTax / BigDecimal(2))
        TaxBreakdown(
          taxableAmount = taxable,
          cgstAmount = halfTax,
          sgstAmount = round2(totalTax - halfTax),
          igstAmount = BigDecimal(0),
          totalAmount = grossTotal
        )
    else
      // Forward calculation: Tax = Taxable * rate / 100
      val taxable = grossTotal
      val totalTax = round2(taxable * (gstRate / BigDecimal(100)))

      if isInterState then
        TaxBreakdown(
          taxableAmount = taxable,
          cgstAmount = BigDecimal(0),
          sgstAmount = BigDecimal(0),
          igstAmount = totalTax,
          totalAmount = round2(taxable + totalTax)
        )
      else
        val halfTax = round2(totalTax / BigDecimal(2))
        TaxBreakdown(
          taxableAmount = taxable,
          cgstAmount = halfTax,
          sgstAmount = round2(totalTax - halfTax),
          igstAmount = BigDecimal(0),
          totalAmount = round2(taxable + totalTax)
        )
